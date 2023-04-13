// import {ApiCallerInterface} from "./interfaces/ApiCallerInterface";
// import {ApiCaller} from "./api/ApiCaller";

// export const api: ApiCallerInterface = new ApiCaller();
import {RequestHandlerInterface} from "./interfaces/RequestHandlerInterface";
import {RequestHandler} from "./requestHandler/RequestHandler";

export const api: RequestHandlerInterface = new RequestHandler();