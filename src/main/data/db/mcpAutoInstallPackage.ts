import { BuiltinMcpServerNames, MCP_AUTO_INSTALL_LEGACY_PACKAGE, MCP_AUTO_INSTALL_PACKAGE } from '@shared/utils/mcp'

export function normalizeMcpAutoInstallArgs(serverName: unknown, args: string[] | null): string[] | null
export function normalizeMcpAutoInstallArgs(serverName: unknown, args: unknown): unknown
/**
 * Repair the removed npm package only for the builtin auto-install server.
 *
 * The server's builtin identity intentionally remains `@cherry/mcp-auto-install`;
 * only the exact package token in its launch arguments moved to the published
 * `@mcpmarket` package. Preserve every other argument so user customizations
 * survive both the v1 migration and subsequent v2 upgrades.
 */
export function normalizeMcpAutoInstallArgs(serverName: unknown, args: unknown): unknown {
  if (serverName !== BuiltinMcpServerNames.mcpAutoInstall || !Array.isArray(args)) return args
  if (!args.includes(MCP_AUTO_INSTALL_LEGACY_PACKAGE)) return args

  return args.map((arg) => (arg === MCP_AUTO_INSTALL_LEGACY_PACKAGE ? MCP_AUTO_INSTALL_PACKAGE : arg))
}
