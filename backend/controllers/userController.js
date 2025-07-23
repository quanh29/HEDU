
export const isUserAuthenticated = async (req, res) => {
  res.json({
    success: true,
    isUserAuthenticated: true,
  });
};   