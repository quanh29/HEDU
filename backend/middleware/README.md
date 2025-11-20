# Authentication Middlewares

## Overview
This directory contains authentication and authorization middlewares used throughout the application to protect routes and ensure proper access control.

## Available Middlewares

### 1. `protectAdmin`
**Purpose**: Ensures only users with admin role can access protected routes.

**Usage**:
```javascript
import { protectAdmin } from '../middleware/auth.js';
router.get('/admin/dashboard', protectAdmin, adminController);
```

**Authorization**:
- Checks if user has `privateMetadata.role === 'admin'`
- Returns 401 if unauthorized

---

### 2. `protectUser`
**Purpose**: Basic user authentication check.

**Usage**:
```javascript
import { protectUser } from '../middleware/auth.js';
router.get('/profile', protectUser, profileController);
```

**Authorization**:
- Verifies user exists in Clerk
- Attaches `req.user` for downstream use

---

### 3. `protectEnrolledUser`
**Purpose**: Ensures user is enrolled in a specific course before accessing course content.

**Usage**:
```javascript
import { protectEnrolledUser } from '../middleware/auth.js';
router.get('/course/:courseId/content', protectEnrolledUser, courseContentController);
```

**Authorization**:
- Requires `courseId` in params or query
- Checks MongoDB Enrollment collection
- Attaches `req.enrollment` and `req.userId`
- Returns 403 if not enrolled

---

### 4. `protectCourseOwner`
**Purpose**: Ensures user is the instructor/owner of a course for management operations.

**Usage**:
```javascript
import { protectCourseOwner } from '../middleware/auth.js';
router.put('/course/:courseId', protectCourseOwner, updateCourseController);
router.delete('/course/:courseId', protectCourseOwner, deleteCourseController);
```

**Authorization**:
- Requires `courseId` in params
- Queries MySQL Courses table for `instructor_id`
- Verifies `instructor_id === userId`
- Attaches `req.userId`
- Returns 403 if not owner

---

### 5. `protectUserAction` ⭐ NEW
**Purpose**: General-purpose middleware for user-specific actions (ratings, profile updates, settings, etc.)

**Usage**:
```javascript
import { protectUserAction } from '../middleware/auth.js';

// Rating routes
router.post('/rating/course/:courseId', protectUserAction, submitRatingController);
router.put('/rating/:ratingId', protectUserAction, updateRatingController);
router.delete('/rating/:ratingId', protectUserAction, deleteRatingController);

// Future use cases
router.put('/user/profile', protectUserAction, updateProfileController);
router.put('/user/settings', protectUserAction, updateSettingsController);
router.post('/user/avatar', protectUserAction, uploadAvatarController);
```

**Authorization**:
- Verifies user is authenticated via Clerk
- Attaches both `req.userId` and `req.user` for convenience
- Returns 401 if not authenticated
- Returns 404 if user not found in Clerk

**When to use**:
- ✅ User updating their own data (profile, settings, preferences)
- ✅ User creating/updating/deleting their own content (ratings, comments, posts)
- ✅ User performing actions that require authentication but not ownership verification
- ❌ Admin-only actions (use `protectAdmin`)
- ❌ Course ownership checks (use `protectCourseOwner`)
- ❌ Enrollment verification (use `protectEnrolledUser`)

---

## Middleware Chaining

You can chain multiple middlewares for complex authorization:

```javascript
// User must be authenticated AND enrolled to submit rating
router.post('/rating/course/:courseId', 
    protectUserAction,      // Check authentication
    protectEnrolledUser,    // Check enrollment
    submitRatingController
);

// User must be course owner to update it
router.put('/course/:courseId',
    protectCourseOwner,     // Checks auth + ownership
    updateCourseController
);
```

## Error Responses

All middlewares return consistent error formats:

```javascript
{
    success: false,
    message: "Error description"
}
```

Common status codes:
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (logged in but no permission)
- `404`: Resource not found
- `500`: Server error

## Request Object Additions

Each middleware adds data to `req` for use in controllers:

| Middleware | Adds to req |
|------------|------------|
| `protectAdmin` | `userId` |
| `protectUser` | `user` |
| `protectEnrolledUser` | `enrollment`, `userId` |
| `protectCourseOwner` | `userId` |
| `protectUserAction` | `userId`, `user` |

## Best Practices

1. **Always use authentication middleware** for protected routes
2. **Chain middlewares in order**: auth → specific checks → controller
3. **Use specific middleware** for specific use cases (don't overuse `protectUserAction`)
4. **Controllers should trust middleware**: Don't re-check authentication in controller if middleware already did it
5. **Access `req.userId` or `req.user`** directly in controllers - no need to call `getAuth(req)` again

## Examples

### ✅ Good
```javascript
// Controller
export const updateRating = async (req, res) => {
    const { userId } = req; // From middleware
    // ... logic
};
```

### ❌ Bad
```javascript
// Controller
export const updateRating = async (req, res) => {
    const { userId } = getAuth(req); // Redundant!
    if (!userId) return res.status(401)... // Already checked by middleware!
    // ... logic
};
```
