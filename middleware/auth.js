// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        if (req.session.user.role !== role) {
            return res.status(403).send(`
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
                <a href="/">Go to Dashboard</a>
            `);
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };