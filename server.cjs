const express = require('express')
const cors = require('cors')
const { execFile } = require('child_process')

const app = express()
app.use(cors())

app.get('/gpu', (_req, res) => {
  execFile(
    'nvidia-smi',
    ['--query-gpu=index,name,memory.used,memory.total,memory.free,utilization.gpu', '--format=csv,noheader,nounits'],
    (err, stdout) => {
      if (err) return res.status(500).json({ error: err.message })
      const gpus = stdout.trim().split('\n').map((line) => {
        const [index, name, memUsed, memTotal, memFree, utilization] = line.split(', ').map(s => s.trim())
        return {
          index: Number(index),
          name,
          memUsedMB: Number(memUsed),
          memTotalMB: Number(memTotal),
          memFreeMB: Number(memFree),
          utilization: Number(utilization),
        }
      })
      res.json({ gpus })
    }
  )
})

const PORT = 3456
app.listen(PORT, () => console.log(`GPU monitor on http://localhost:${PORT}/gpu`))
