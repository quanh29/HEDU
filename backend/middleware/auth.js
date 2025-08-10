import {clerkClient} from '@clerk/express';

export const protectAdmin = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        const user = await clerkClient.users.getUser(userId);

        if (user.privateMetadata.role !== 'admin') {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        next();

    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

export const protectUser = async (req, res, next) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await clerkClient.users.getUser(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.user = user; // Attach user to request for further use
        next();

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};