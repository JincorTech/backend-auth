import { Response, Request, NextFunction } from 'express';

export default class IpWhiteListFilter {
  whiteList: Array<string>;

  /**
   * constructor
   * @param whiteList Array<string>
   */
  constructor(whiteList: Array<string>) {
    this.whiteList = whiteList;
  }

  filter(req: Request, res: Response, next: NextFunction) {
    let ip = req.ip;

    /*
     Check if IP has ipv6 prefix and remove it.
     See: https://stackoverflow.com/questions/29411551/express-js-req-ip-is-returning-ffff127-0-0-1
     */
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }

    if (this.whiteList.indexOf(ip) !== -1) {
      return next();
    }

    return res.status(403).send({
      error: 'Forbidden'
    });
  }
}
