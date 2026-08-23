# lms-backend

lms-backend
│
├── src
│
├── config
│ ├── db.js
│ ├── cloudinary.js
│ └── env.js
│
├── controllers
│ ├── auth.controller.js
│ │ ├── register
│ │ ├── login
│ │ ├── logout
│ │ ├── getMe
│ │ ├── updateProfile
│ │ ├── changePassword
│ │ ├── forgotPassword
│ │ └── resetPassword
│ │
│ ├── admin.controller.js
│ │ ├── dashboard
│ │ ├── getAllUsers
│ │ ├── suspendUser
│ │ ├── activateUser
│ │ └── deleteUser
│ │
│ ├── instructor.controller.js
│ │ ├── dashboard
│ │ └── getMyCourses
│ │
│ ├── course.controller.js
│ │ ├── createCourse
│ │ ├── getCourses
│ │ ├── getCourseDetails
│ │ ├── updateCourse
│ │ └── deleteCourse
│ │
│ ├── lesson.controller.js
│ │ ├── createLesson
│ │ ├── getLessons
│ │ ├── getLessonById
│ │ ├── updateLesson
│ │ └── deleteLesson
│ │
│ └── enrollment.controller.js
│ ├── enrollCourse
│ ├── cancelEnrollment
│ ├── getMyCourses
│ └── getCourseStudents
│
├── middleware
│ ├── auth.js
│ ├── role.js
│ ├── upload.js
│ ├── validate.js
│ ├── errorHandler.js
│ └── notFound.js
│
├── models
│ ├── User.js
│ ├── Course.js
│ ├── Lesson.js
│ └── Enrollment.js
│
├── routes
│ ├── auth.routes.js
│ ├── admin.routes.js
│ ├── instructor.routes.js
│ ├── course.routes.js
│ ├── lesson.routes.js
│ └── enrollment.routes.js
│
├── utils
│ ├── asyncHandler.js
│ ├── ApiResponse.js
│ ├── ApiError.js
│ ├── cloudinary.js
│ ├── jwt.js
│ └── sendEmail.js
│
├── validations
│ ├── auth.validation.js
│ ├── course.validation.js
│ ├── lesson.validation.js
│ └── enrollment.validation.js
│
├── app.js
└── server.js
