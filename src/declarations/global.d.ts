import { IDirCheckerAPI } from "src/interfaces/dir-checker-api.interface"

export {}

declare global {
  interface Window {
    api: IDirCheckerAPI
  }
}