import { CustomScheme } from "electron";

export const imageMediaProtocol = 'image-media';
export const videoMediaProtocol = 'video-media';
export const schemes: CustomScheme[] = [
    { 
        scheme: videoMediaProtocol, 
        privileges: { 
            secure: true, 
            standard: true,
            supportFetchAPI: true,
            stream: true,
            corsEnabled: true,
            bypassCSP: true 
        } 
    },
    {
        scheme: imageMediaProtocol,
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true
        }
    }
];
