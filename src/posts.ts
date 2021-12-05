import { prisma } from './prisma'

type Post = {
  id: string
  title: string
  content: string
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: {
      id,
    },
  })
}

export async function createPost(data: Post) {
  return prisma.post.create({
    data,
  })
}

export async function updatePost(id: string, data: Post) {
  return prisma.post.update({
    where: { id },
    data,
  })
}
