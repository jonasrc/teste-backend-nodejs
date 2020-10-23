import * as jwt from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';
import {User} from "~/entities/User";

declare global {
    namespace Express {
        export interface Request {
            user: User;
        }
    }
}

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
    let accessToken = req.header('x-access-token');

    if (!accessToken){
        return res.status(403).send('No access token provided.');
    }

    try{
        jwt.verify(accessToken, <string>process.env.JWT_SECRET, function(error, user) {
            if (error || !user) {
                return res.status(500).json({auth: false, message: 'Failed to authenticate token.' });
            }

            req.user = <User>user;
            next();
        });
    }
    catch(exception){
        return res.status(401).send('Unauthorized.');
    }
}

module.exports = {
    verifyToken: verifyToken
};