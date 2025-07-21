// import {clerkClient} from '@clerk/clerk-sdk-node';

// export const protectAdmin = async (req, res, next) => {
//     try {
//         const { userId } = req.auth;

//         const user = await clerkClient.users.getUser(userId);

//         if (user.privateMetadata.role !== 'admin') {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }
//         next();

//     } catch (error) {
//         return res.status(500).json({ message: 'Server error' });
//     }
// };

