const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    try{

        const token = req.headers.authorization?.split(" ")[1];

        if(!token){

            return res.status(401).json({
                success:false,
                message:"No Token"
            });

        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "admin"){

            return res.status(403).json({
                success:false,
                message:"Access Denied"
            });

        }

        req.admin = decoded;

        next();

    }catch(err){

        return res.status(401).json({
            success:false,
            message:"Invalid Token"
        });

    }

};