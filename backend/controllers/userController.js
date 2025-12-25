import { Webhook } from 'svix';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

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
