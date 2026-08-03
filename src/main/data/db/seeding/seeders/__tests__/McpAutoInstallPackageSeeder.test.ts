import { mcpServerTable } from '@data/db/schemas/mcpServer'
import { McpAutoInstallPackageSeeder } from '@data/db/seeding/seeders/McpAutoInstallPackageSeeder'
import { BuiltinMcpServerNames, MCP_AUTO_INSTALL_LEGACY_PACKAGE, MCP_AUTO_INSTALL_PACKAGE } from '@shared/utils/mcp'
import { setupTestDatabase } from '@test-helpers/db'
import { asc } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

describe('McpAutoInstallPackageSeeder', () => {
  const dbh = setupTestDatabase()

  it('repairs stale rows once while preserving correct and unrelated servers', async () => {
    await dbh.db.insert(mcpServerTable).values([
      {
        id: 'stale-auto-install',
        name: BuiltinMcpServerNames.mcpAutoInstall,
        type: 'inMemory',
        command: 'bun',
        args: ['x', MCP_AUTO_INSTALL_LEGACY_PACKAGE, 'connect', '--json', '--custom'],
        isActive: false,
        sortOrder: 0
      },
      {
        id: 'correct-auto-install',
        name: BuiltinMcpServerNames.mcpAutoInstall,
        type: 'inMemory',
        command: 'npx',
        args: ['-y', MCP_AUTO_INSTALL_PACKAGE, 'connect', '--json'],
        isActive: true,
        sortOrder: 1
      },
      {
        id: 'custom-server',
        name: 'custom-server',
        type: 'stdio',
        command: 'npx',
        args: ['-y', MCP_AUTO_INSTALL_LEGACY_PACKAGE],
        isActive: false,
        sortOrder: 2
      }
    ])

    const seeder = new McpAutoInstallPackageSeeder()
    seeder.run(dbh.db)
    const afterFirstRun = await dbh.db.select().from(mcpServerTable).orderBy(asc(mcpServerTable.sortOrder))

    expect(afterFirstRun.map(({ id, command, args, isActive }) => ({ id, command, args, isActive }))).toEqual([
      {
        id: 'stale-auto-install',
        command: 'bun',
        args: ['x', MCP_AUTO_INSTALL_PACKAGE, 'connect', '--json', '--custom'],
        isActive: false
      },
      {
        id: 'correct-auto-install',
        command: 'npx',
        args: ['-y', MCP_AUTO_INSTALL_PACKAGE, 'connect', '--json'],
        isActive: true
      },
      {
        id: 'custom-server',
        command: 'npx',
        args: ['-y', MCP_AUTO_INSTALL_LEGACY_PACKAGE],
        isActive: false
      }
    ])

    seeder.run(dbh.db)
    const afterSecondRun = await dbh.db.select().from(mcpServerTable).orderBy(asc(mcpServerTable.sortOrder))
    expect(afterSecondRun).toEqual(afterFirstRun)
  })
})
