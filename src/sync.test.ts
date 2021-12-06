import { sync } from './sync'
import { list, retrieve } from './__mocks__/@notionhq/client'
import { getPost, createPost, updatePost } from './posts'
import { mocked } from 'ts-jest/utils'
import identity from 'lodash/identity'
import chalk from 'chalk'
const {
  notionBlockToMarkdown,
} = require('gatsby-source-notion-api/src/transformers/notion-block-to-markdown')

jest.mock('@notionhq/client')
jest.mock('./posts', () => ({
  __esModule: true,
  getPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
}))
jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    green: jest.fn(),
  },
}))

jest.mock(
  'gatsby-source-notion-api/src/transformers/notion-block-to-markdown',
  () => ({
    notionBlockToMarkdown: jest.fn(() => ({})),
  })
)

const mockedGetPost = mocked(getPost)
const mockedCreatePost = mocked(createPost)
const mockedUpdatePost = mocked(updatePost)
const mockedChalkGreen = mocked(chalk.green)

describe('Update Script', () => {
  beforeEach(() => {
    mockedChalkGreen.mockReset()
  })

  it("should create a post if it doesn't exist", async () => {
    list
      .mockImplementationOnce(() => ({
        results: [
          {
            id: '1',
            has_children: true,
            children: [
              {
                id: '2',
                type: 'paragraph',
                has_children: false,
                children: [],
              },
            ],
          },
        ],
      }))
      .mockImplementationOnce(() => ({
        results: [
          {
            id: '1',
            has_children: false,
            children: [
              {
                id: '2',
                type: 'paragraph',
                has_children: false,
                children: [],
              },
            ],
          },
        ],
      }))
    retrieve.mockImplementation(() => ({
      id: '1',
      properties: {
        title: {
          title: [
            {
              plain_text: 'foo',
            },
          ],
        },
      },
    }))
    mockedGetPost.mockImplementation(() => null)
    mockedCreatePost.mockImplementation(identity)

    await sync()

    expect(chalk.green).toHaveBeenCalledWith('Created: foo')
    expect(chalk.green).toHaveBeenCalledTimes(1)

    expect(notionBlockToMarkdown).toHaveBeenCalledTimes(1)
    expect(notionBlockToMarkdown).toHaveBeenCalledWith({
      children: [
        {
          children: [
            { children: [], has_children: false, id: '2', type: 'paragraph' },
          ],
          has_children: false,
          id: '1',
        },
      ],
      has_children: true,
      id: '1',
    })
  })

  it('should update a post if the updated date is different than the one in the database', async () => {
    list.mockImplementation(() => ({
      results: [
        {
          id: '1',
          has_children: false,
          children: [],
          last_edited_time: '2020-01-01T00:10:00.000Z',
        },
      ],
    }))
    retrieve.mockImplementation(() => ({
      id: '1',
      properties: {
        title: {
          title: [
            {
              plain_text: 'foo',
            },
          ],
        },
      },
    }))
    mockedGetPost.mockImplementation(() =>
      Promise.resolve({
        id: '1',
        title: 'foo',
        content: 'foo',
        updated_at: new Date('2020-01-01T00:00:00.000Z'),
        published: false,
        created_at: new Date('2020-01-01T00:00:00.000Z'),
      })
    )
    mockedUpdatePost.mockImplementation(identity)

    await sync()

    expect(chalk.green).toHaveBeenCalledWith('Updated: foo')
    expect(chalk.green).toHaveBeenCalledTimes(1)
  })

  it('should not do anything if the updated times are the same', async () => {
    list.mockImplementation(() => ({
      results: [
        {
          id: '1',
          has_children: false,
          children: [],
          last_edited_time: '2020-01-01T00:00:00.000Z',
        },
      ],
    }))
    retrieve.mockImplementation(() => ({
      id: '1',
      properties: {
        title: {
          title: [
            {
              plain_text: 'foo',
            },
          ],
        },
      },
    }))
    mockedGetPost.mockImplementation(() =>
      Promise.resolve({
        id: '1',
        title: 'foo',
        content: 'foo',
        updated_at: new Date('2020-01-01T00:00:00.000Z'),
        published: false,
        created_at: new Date('2020-01-01T00:00:00.000Z'),
      })
    )
    mockedUpdatePost.mockImplementation(identity)

    await sync()

    expect(chalk.green).toHaveBeenCalledWith('No Change: foo')
    expect(chalk.green).toHaveBeenCalledTimes(1)
  })
})
