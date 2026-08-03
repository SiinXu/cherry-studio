import { normalizeMcpAutoInstallArgs } from '@data/db/mcpAutoInstallPackage'
import { BuiltinMcpServerNames, MCP_AUTO_INSTALL_LEGACY_PACKAGE, MCP_AUTO_INSTALL_PACKAGE } from '@shared/utils/mcp'
import { describe, expect, it } from 'vitest'

describe('normalizeMcpAutoInstallArgs', () => {
  it('replaces only the removed package token and preserves custom arguments', () => {
    expect(
      normalizeMcpAutoInstallArgs(BuiltinMcpServerNames.mcpAutoInstall, [
        'x',
        MCP_AUTO_INSTALL_LEGACY_PACKAGE,
        'connect',
        '--json',
        '--custom'
      ])
    ).toEqual(['x', MCP_AUTO_INSTALL_PACKAGE, 'connect', '--json', '--custom'])
  })

  it('leaves correct, unrelated, and malformed values unchanged', () => {
    const correct = ['-y', MCP_AUTO_INSTALL_PACKAGE, 'connect', '--json']
    const unrelated = ['-y', MCP_AUTO_INSTALL_LEGACY_PACKAGE]
    const malformed = 'not-an-array'

    expect(normalizeMcpAutoInstallArgs(BuiltinMcpServerNames.mcpAutoInstall, correct)).toBe(correct)
    expect(normalizeMcpAutoInstallArgs('custom-server', unrelated)).toBe(unrelated)
    expect(normalizeMcpAutoInstallArgs(BuiltinMcpServerNames.mcpAutoInstall, malformed)).toBe(malformed)
  })
})
