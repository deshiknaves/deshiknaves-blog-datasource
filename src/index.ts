import dotenv from 'dotenv'
import { initialize, prisma } from './prisma'
import { sync } from './sync'

dotenv.config()

initialize()

sync()
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect()
  })
