import { chromium } from 'playwright'

const mockUser = {
  id: 'p-1001',
  name: '测试用户',
  sex: '男',
  age: 35,
  relevancy_doctor_id: 1,
  nArtificial: '0',
}

const mockDoctors = [
  {
    id: 1,
    name: '石钟',
    department: '呼吸内科',
    rank: '主任医师',
    headerpic: '',
  },
]

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
    ],
  })

  const context = await browser.newContext({
    permissions: ['microphone'],
    ignoreHTTPSErrors: true,
  })

  const page = await context.newPage()
  const consoleLogs = []
  const networkLogs = []

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
    })
  })

  page.on('pageerror', (err) => {
    consoleLogs.push({
      type: 'pageerror',
      text: err.message,
    })
  })

  page.on('requestfailed', (request) => {
    networkLogs.push({
      url: request.url(),
      method: request.method(),
      failureText: request.failure()?.errorText,
    })
  })

  await page.route('**/apis/ExtExportAPI/GetAllUsers', async (route, request) => {
    let payload = {}
    try {
      payload = request.postDataJSON()
    } catch (error) {
      // ignore malformed payload parsing
    }

    const body =
      payload.processing_state === 1
        ? JSON.stringify([mockUser])
        : JSON.stringify([])

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  })

  await page.route('**/apis/ExtExportAPI/GetAllDoctors', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDoctors),
    })
  })

  await page.route('**/apis/ExtExportAPI/SetTime', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await page.route('**/apis/ExtExportAPI/UpdateRelevancy', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  await page.goto('http://localhost:3003/index2', {
    waitUntil: 'networkidle',
  })

  await page.getByPlaceholder('请输入用户名').fill(mockUser.name)
  await page.getByRole('button', { name: '进入预问诊' }).click()

  // ensure Step2Local is rendered
  await page.waitForTimeout(4000)

  // click the start icon to progress workflow to status 3
  const startIcon = page.locator('img[src*="icon/6"]')
  if (await startIcon.count()) {
    await startIcon.first().click()
  }

  await page.waitForTimeout(1500)

  const micButton = page.getByRole('button', { name: '开启对话' })
  if (await micButton.isVisible()) {
    await micButton.click()
    await page.waitForTimeout(4000)
  }

  const stopButton = page.getByRole('button', { name: '结束对话' })
  if (await stopButton.isVisible()) {
    await stopButton.click()
    await page.waitForTimeout(1000)
  }

  await browser.close()

  return { consoleLogs, networkLogs }
}

run()
  .then((result) => {
    console.log(
      JSON.stringify(
        {
          consoleLogs: result.consoleLogs,
          networkLogs: result.networkLogs,
        },
        null,
        2,
      ),
    )
  })
  .catch((error) => {
    console.error('DevTools voice check failed:', error)
    process.exitCode = 1
  })
