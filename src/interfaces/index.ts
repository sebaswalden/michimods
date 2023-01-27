import { Byte } from 'nbt-ts';

export interface ServerNBT {
  name: string,
  value: {
    servers: [
      {
        hidden: Byte,
        icon?: string,
        ip: string,
        name: string,
      }
    ]
  },
  length: number,
}
