import { PrismaClient } from '@prisma/client'

export let prisma: PrismaClient

export function initialize() {
  prisma = new PrismaClient()
}
