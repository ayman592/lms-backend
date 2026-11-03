import { randomUUID } from "node:crypto";
import { getRedisClient } from "../config/redis.js";
import { generateAccessToken, generateRefreshToken } from "./jwt.js";

const ACCESS_TTL = 15 * 60; // 15 دقيقة
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 أيام

const accessKey = (sid) => `auth:access:${sid}`;
const refreshKey = (sid) => `auth:refresh:${sid}`;
const userSessionsKey = (userId) => `auth:user-sessions:${userId}`;

/**
 * إنشاء جلسة جديدة كاملة (access + refresh)
 */
export const createAuthSession = async (user) => {
  const redis = getRedisClient();
  const sessionId = randomUUID();
  const userId = user._id.toString();

  const accessToken = generateAccessToken({
    id: userId,
    role: user.role,
    name: user.name,
    sid: sessionId,
  });
  const refreshToken = generateRefreshToken({ id: userId, sid: sessionId });

  await redis
    .multi()
    .set(accessKey(sessionId), userId, "EX", ACCESS_TTL)
    .set(refreshKey(sessionId), userId, "EX", REFRESH_TTL)
    .sadd(userSessionsKey(userId), sessionId)
    .expire(userSessionsKey(userId), REFRESH_TTL)
    .exec();

  return { accessToken, refreshToken, sessionId };
};

/**
 * تجديد Access (مع تدوير Refresh)
 * - يتحقق أن جلسة الـ refresh لا تزال موجودة في Redis
 * - يصدر access جديد + refresh جديد
 * - يجدد TTL للـ refresh key
 */
export const rotateAuthSession = async (oldRefreshToken) => {
  const { verifyRefreshToken } = await import("./jwt.js");
  const decoded = verifyRefreshToken(oldRefreshToken); // يرمي لو منتهي/مزور

  if (typeof decoded.sid !== "string") {
    throw new Error("Invalid session");
  }

  const redis = getRedisClient();
  const sessionUserId = await redis.get(refreshKey(decoded.sid));

  // الجلسة ملغاة أو منتهية
  if (!sessionUserId || sessionUserId !== decoded.id) {
    throw new Error("Session expired");
  }

  // نجيب اليوزر لضمان أنه ما زال موجوداً وغير موقوف
  const User = (await import("../models/User.model.js")).default;
  const user = await User.findById(decoded.id).select(
    "_id role name isSuspended",
  );
  if (!user) throw new Error("User not found");
  if (user.isSuspended) throw new Error("Account suspended");

  const userId = user._id.toString();

  const accessToken = generateAccessToken({
    id: userId,
    role: user.role,
    name: user.name,
    sid: decoded.sid,
  });
  const refreshToken = generateRefreshToken({ id: userId, sid: decoded.sid });

  await redis
    .multi()
    .set(accessKey(decoded.sid), userId, "EX", ACCESS_TTL)
    .set(refreshKey(decoded.sid), userId, "EX", REFRESH_TTL)
    .expire(userSessionsKey(userId), REFRESH_TTL)
    .exec();

  return { accessToken, refreshToken, sessionId: decoded.sid };
};

/**
 * إبطال جلسة واحدة (logout من جهاز واحد)
 */
export const revokeAuthSession = async (sessionId, userId) => {
  if (!sessionId || !userId) return;
  const redis = getRedisClient();
  const userKey = userSessionsKey(userId.toString());

  await redis
    .multi()
    .del(accessKey(sessionId))
    .del(refreshKey(sessionId))
    .srem(userKey, sessionId)
    .exec();
};

/**
 * إبطال جميع جلسات المستخدم (logout من كل الأجهزة / تغيير كلمة السر)
 */
export const revokeUserSessions = async (userId) => {
  const redis = getRedisClient();
  const userKey = userSessionsKey(userId.toString());
  const sessionIds = await redis.smembers(userKey);

  const multi = redis.multi();
  for (const sid of sessionIds) {
    multi.del(accessKey(sid));
    multi.del(refreshKey(sid));
  }
  multi.del(userKey);

  await multi.exec();
};
