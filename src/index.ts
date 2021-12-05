import dotenv from 'dotenv'
import { Client } from '@notionhq/client'
import get from 'lodash/fp/get'
import { createPost, getPost, updatePost } from './posts'
const {
  notionBlockToMarkdown,
} = require('gatsby-source-notion-api/src/transformers/notion-block-to-markdown')
import { initialize, prisma } from './prisma'
import chalk from 'chalk'

dotenv.config()

initialize()

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function asyncForEach(array: any, callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function loadBlock(block: any) {
  if (!block.has_children) {
    return block
  }

  const blocks = await notion.blocks.children.list({
    block_id: block.id,
  })

  const children = await blocks.results.reduce(
    async (promisedAcc: any, child: any) => {
      const acc = await promisedAcc
      acc.push(await loadBlock(child))
      return acc
    },
    Promise.resolve([])
  )

  return { ...block, children }
}

async function getPostDetails(page: any, block: any) {
  const loaded = await loadBlock(block)
  return {
    id: block.id,
    title: getTitle(page.properties.title),
    content: notionBlockToMarkdown(loaded),
    created_at: block.created_time,
    updated_at: block.last_edited_time,
  }
}

const getTitle = get('title.0.plain_text')

export async function main() {
  // Get all the pages for the blog
  const blocks = await notion.blocks.children.list({
    block_id: process.env.NOTION_PAGE_ID,
  })

  await blocks.results.reduce(async (promisedAcc: any, block: any) => {
    const acc = await promisedAcc
    const page = await notion.pages.retrieve({
      page_id: block.id,
    })

    const existing = await getPost(block.id)

    if (!existing) {
      const post = await getPostDetails(page, block)
      await createPost(post)
      console.log(chalk.green(`Created: ${post.title}`))
    } else if (
      new Date(block.last_edited_time).getTime() !==
      new Date(existing.updated_at).getTime()
    ) {
      const post = await getPostDetails(page, block)
      await updatePost(post.id, post)
      console.log(chalk.green(`Updated: ${post.title}`))
    } else {
      console.log(chalk.green(`No Change: ${getTitle(page.properties.title)}`))
    }

    return acc
  }, Promise.resolve([]))
}

main()
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect()
  })
