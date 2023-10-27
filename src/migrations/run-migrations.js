import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'

const stage = process.argv[2]
const region = process.argv[3]

const __filename = fileURLToPath(import.meta.url)
const tablesPath = `${dirname(__filename)}/collections`

const tableFiles = fs.readdirSync(tablesPath)

const runMigrations = async () => {
  for (const file of tableFiles) {
    const filePath = `${tablesPath}/${file}`
    const array = filePath.split('/')
    const result = array[array.length - 1].split('.')

    await fs
      .writeFileSync(`${filePath}.tmp`, fs.readFileSync(filePath, 'utf-8')
        .replace(/<STAGE>/g, stage))

    try {
      if (stage === 'local') {
        await execSync(`aws dynamodb create-table --cli-input-json file://${filePath}.tmp --endpoint-url http://localhost:8000 > /dev/null 2>&1`)
      } else {
        await execSync(`aws dynamodb create-table --cli-input-json file://${filePath}.tmp --region ${region} > /dev/null 2>&1`)
      }
      console.log(`${result[0]} table created successfully`)
    } catch (error) {
      if (error.status === 254) {
        console.log(`${result[0]} already created`)
      } else {
        throw error
      }
    }

    await fs.unlinkSync(`${filePath}.tmp`)
  }
}

runMigrations()
