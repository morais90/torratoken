import { describe, expect, it } from "vitest"
import { isAllowedRepoUrl, isValidBranch, parseRepo } from "./repo"

describe("parseRepo", () => {
  it("parses owner and repo from https and ssh URLs", () => {
    expect(parseRepo("https://github.com/owner/repo.git")).toEqual({ owner: "owner", repo: "repo" })
    expect(parseRepo("git@github.com:owner/repo.git")).toEqual({ owner: "owner", repo: "repo" })
    expect(parseRepo("ssh://git@github.com/owner/repo")).toEqual({ owner: "owner", repo: "repo" })
  })

  it("rejects URLs with an unsupported scheme", () => {
    expect(() => parseRepo("ext::sh -c evil")).toThrow()
    expect(() => parseRepo("file:///tmp/repo.git")).toThrow()
  })
})

describe("isAllowedRepoUrl", () => {
  it("allows https and ssh, rejects everything else", () => {
    expect(isAllowedRepoUrl("https://github.com/o/r.git")).toBe(true)
    expect(isAllowedRepoUrl("git@github.com:o/r.git")).toBe(true)
    expect(isAllowedRepoUrl("ssh://git@github.com/o/r")).toBe(true)
    expect(isAllowedRepoUrl("ext::sh -c evil")).toBe(false)
    expect(isAllowedRepoUrl("file:///tmp/r")).toBe(false)
    expect(isAllowedRepoUrl("http://github.com/o/r")).toBe(false)
  })
})

describe("isValidBranch", () => {
  it("accepts a torra branch name", () => {
    expect(isValidBranch("torra/run-1-doc-writer")).toBe(true)
  })

  it("rejects injection and traversal shapes", () => {
    expect(isValidBranch("-x")).toBe(false)
    expect(isValidBranch("torra/../main")).toBe(false)
    expect(isValidBranch("a b")).toBe(false)
    expect(isValidBranch("a//b")).toBe(false)
    expect(isValidBranch("x.lock")).toBe(false)
    expect(isValidBranch("")).toBe(false)
  })
})
