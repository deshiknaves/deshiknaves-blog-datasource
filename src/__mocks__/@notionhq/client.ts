export const list = jest.fn()
export const retrieve = jest.fn()

export function Client() {
  return {
    blocks: {
      children: {
        list,
      },
    },
    pages: {
      retrieve,
    },
  }
}
