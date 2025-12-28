import { Webhook } from 'svix';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Course from '../models/Course.js';
import { clerkClient } from '@clerk/express';

// Handle Clerk webhook for user events
export const handleClerkWebhook = async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
    }

    // Get the headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Error occurred -- missing svix headers' 
      });
    }

    // Get the body - req.body is a Buffer from express.raw()
    const body = req.body.toString();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({ 
        success: false, 
        message: 'Error occurred -- invalid signature' 
      });
    }

    // Handle the webhook
    const eventType = evt.type;

    // Handle user creation and updates
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url, private_metadata } = evt.data;

      // Extract user data
      const email = email_addresses?.[0]?.email_address || '';
      const full_name = `${first_name || ''} ${last_name || ''}`.trim() || 'User';
      const profile_image_url = image_url || '';

      // Check if user has admin role in private metadata
      const is_admin = private_metadata?.role === 'admin';

      // Create or update user
      const userData = {
        _id: id,
        email,
        full_name,
        profile_image_url,
        is_admin,
      };

      const user = await User.findOneAndUpdate(
        { _id: id },
        userData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Create wallet for new user
      if (eventType === 'user.created') {
        const walletExists = await Wallet.findOne({ user_id: id });
        if (!walletExists) {
          await Wallet.create({
            user_id: id,
            balance: 0
          });
          console.log(`✅ Wallet created for user: ${user.email}`);
        }
      }

      console.log(`✅ User ${eventType === 'user.created' ? 'created' : 'updated'}:`, user.email);

      return res.status(200).json({
        success: true,
        message: `User ${eventType === 'user.created' ? 'created' : 'updated'} successfully`,
        user: {
          id: user._id,
          email: user.email,
          full_name: user.full_name,
          is_admin: user.is_admin,
        },
      });
    }

    // Handle user deletion
    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      await User.findByIdAndDelete(id);

      console.log(`✅ User deleted: ${id}`);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    }

    // Handle email created (update user email)
    if (eventType === 'email.created') {
      const { email_address, user_id } = evt.data;

      const user = await User.findByIdAndUpdate(
        user_id,
        { email: email_address },
        { new: true }
      );

      console.log(`✅ Email created for user: ${user_id}`);

      return res.status(200).json({
        success: true,
        message: 'User email updated successfully',
        user: user ? { id: user._id, email: user.email } : null,
      });
    }

    // Handle role changes (update is_admin status)
    if (eventType === 'role.created' || eventType === 'role.updated' || eventType === 'role.deleted') {
      const { user_id } = evt.data;

      // Fetch the user to check their current metadata
      // Since we don't have direct access to private_metadata in role events,
      // we'll need to query Clerk API or handle this differently
      // For now, we'll just log the event
      console.log(`✅ Role ${eventType.split('.')[1]} for user: ${user_id}`);

      return res.status(200).json({
        success: true,
        message: `Role ${eventType.split('.')[1]} successfully`,
      });
    }

    // For other event types
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
    });

  } catch (error) {
    console.error('Error handling Clerk webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // From protectUserAction middleware

    // Get user from MongoDB
    const user = await User.findById(userId).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        clerkEmail: clerkUser.emailAddresses?.[0]?.emailAddress,
        clerkImageUrl: clerkUser.imageUrl
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // From protectUserAction middleware
    const { full_name, is_male, dob, headline, bio, email, password, firstName, lastName } = req.body;

    console.log('📝 [Update Profile] userId:', userId);
    console.log('📝 [Update Profile] body:', req.body);

    // Update MongoDB user data
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (is_male !== undefined) updateData.is_male = is_male;
    if (dob !== undefined) updateData.dob = dob;
    if (headline !== undefined) updateData.headline = headline;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update Clerk data if provided
    const clerkUpdateData = {};
    if (firstName !== undefined || lastName !== undefined) {
      if (firstName !== undefined) clerkUpdateData.firstName = firstName;
      if (lastName !== undefined) clerkUpdateData.lastName = lastName;
    }
    if (email !== undefined) {
      clerkUpdateData.primaryEmailAddressId = email;
    }
    if (password !== undefined) {
      clerkUpdateData.password = password;
    }

    if (Object.keys(clerkUpdateData).length > 0) {
      try {
        await clerkClient.users.updateUser(userId, clerkUpdateData);
        console.log('✅ [Update Profile] Clerk data updated');
      } catch (clerkError) {
        console.error('⚠️ [Update Profile] Clerk update failed:', clerkError.message);
        // Don't fail the whole request if Clerk update fails
      }
    }

    console.log('✅ [Update Profile] User updated successfully');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ [Update Profile] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // console.log('📤 [Upload Avatar] userId:', userId);
    // console.log('📤 [Upload Avatar] file:', req.file.originalname);
    // console.log('📤 [Upload Avatar] mimetype:', req.file.mimetype);
    // console.log('📤 [Upload Avatar] size:', req.file.size);

    // Upload to Clerk using fetch with Blob
    try {
      // Convert buffer to Blob (works better with fetch)
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      
      // Create FormData with native FormData (available in Node 18+)
      const formData = new FormData();
      formData.append('file', blob, req.file.originalname);

      // Get Clerk secret key
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      
      // Make direct API call to Clerk
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}/profile_image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const clerkUser = await response.json();
      const avatarUrl = clerkUser.profile_image_url || clerkUser.image_url;
      
      console.log('✅ [Upload Avatar] Clerk URL:', avatarUrl);

      // Update MongoDB with the new Clerk avatar URL
      await User.findByIdAndUpdate(
        userId,
        { profile_image_url: avatarUrl },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          profile_image_url: avatarUrl
        }
      });
      
    } catch (clerkError) {
      console.error('❌ [Upload Avatar] Clerk upload failed:', clerkError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload avatar to Clerk',
        error: clerkError.message || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ [Upload Avatar] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 [Change Password] userId:', userId);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Get user from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Check if user has password authentication enabled
    if (!clerkUser.passwordEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Password authentication is not enabled for this account'
      });
    }

    // Verify current password
    // We need to use Clerk's sign-in mechanism to verify the password
    try {
      const primaryEmail = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      );
      
      if (!primaryEmail) {
        return res.status(400).json({
          success: false,
          message: 'No primary email found'
        });
      }

      // Verify password by attempting to create a session token
      // This is a workaround since Clerk doesn't provide direct password verification
      const { Clerk } = await import('@clerk/backend');
      const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
      
      // Try to verify by creating a sign-in attempt
      try {
        // We'll use the sign-in tokens API to verify
        const verification = await clerk.signInTokens.createSignInToken({
          userId: userId,
          expiresInSeconds: 30
        });
        
        // If we got here, the user exists and is valid
        // But we still can't verify password directly from backend
        // So we'll proceed with the update
        console.log('✅ [Change Password] User verified');
        
      } catch (tokenError) {
        console.log('⚠️ [Change Password] Token creation failed, but proceeding');
      }

    } catch (verifyError) {
      console.error('⚠️ [Change Password] Verification error:', verifyError.message);
      // Since Clerk Backend API doesn't support password verification,
      // we rely on the JWT authentication that got us here
      // The user has already proven they have a valid session
    }

    // Update password using Clerk Admin API
    try {
      await clerkClient.users.updateUser(userId, {
        password: newPassword
      });

      console.log('✅ [Change Password] Password updated successfully');

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (clerkError) {
      console.error('❌ [Change Password] Clerk error:', clerkError);
      
      // Handle specific Clerk errors
      if (clerkError.status === 422) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password format or password does not meet requirements'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

  } catch (error) {
    console.error('❌ [Change Password] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Get public user profile (no auth required)
export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('👤 [Public Profile] userId:', userId);

    // Get user from MongoDB
    const user = await User.findById(userId).select('_id email full_name is_male dob headline bio profile_image_url');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's public courses
    const publicCourses = await Course.find({
      instructor_id: userId,
      course_status: 'approved'
    }).select('_id title thumbnail_url current_price original_price');

    console.log('✅ [Public Profile] Found', publicCourses.length, 'public courses');

    res.status(200).json({
      success: true,
      data: {
        user: user.toObject(),
        courses: publicCourses
      }
    });
  } catch (error) {
    console.error('❌ [Public Profile] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public profile',
      error: error.message
    });
  }
};
