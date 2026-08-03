import { normalizeMcpAutoInstallArgs } from '@data/db/mcpAutoInstallPackage'
import { mcpServerTable } from '@data/db/schemas/mcpServer'
import { MCP_AUTO_INSTALL_LEGACY_PACKAGE, MCP_AUTO_INSTALL_PACKAGE } from '@shared/utils/mcp'
import { eq } from 'drizzle-orm'

import type { DbType, ISeeder } from '../../types'
import { hashObject } from '../hashObject'

/**
 * Repairs v2 databases created before the auto-install package moved to its
 * published npm scope. The exact-token guard keeps unrelated/custom servers
 * untouched, while the normalizer preserves every user-edited launch option.
 */
export class McpAutoInstallPackageSeeder implements ISeeder {
  readonly name = 'mcpAutoInstallPackage'
  readonly description = 'Repair stale builtin MCP auto-install package arguments'
  readonly executionPolicy = 'run-on-change' as const
  readonly version = hashObject({
    from: MCP_AUTO_INSTALL_LEGACY_PACKAGE,
    to: MCP_AUTO_INSTALL_PACKAGE
  })

  run(db: DbType): void {
    db.transaction((tx) => {
      const servers = tx
        .select({ id: mcpServerTable.id, name: mcpServerTable.name, args: mcpServerTable.args })
        .from(mcpServerTable)
        .all()

      for (const server of servers) {
        const normalizedArgs = normalizeMcpAutoInstallArgs(server.name, server.args)
        if (normalizedArgs === server.args) continue

        tx.update(mcpServerTable).set({ args: normalizedArgs }).where(eq(mcpServerTable.id, server.id)).run()
      }
    })
  }
}
