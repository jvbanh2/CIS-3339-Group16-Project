<template>
  <div>
    <canvas class="p-10" ref="attendanceChart"></canvas>
  </div>
</template>

<script setup>
// Migrated from Options API to Composition API (Sprint 2, F1 task 7).
// props -> defineProps(); this.$refs.attendanceChart -> a ref() of the same
// name, which <script setup> auto-binds to the template's ref="attendanceChart";
// async mounted() -> onMounted().
import { ref, onMounted } from 'vue'
import { Chart, registerables } from 'chart.js'
import { Colors } from 'chart.js'

Chart.register(...registerables)
Chart.register(Colors)

const props = defineProps({
  label: {
    type: Array
  },
  chartData: {
    type: Array
  }
})

const attendanceChart = ref(null)

onMounted(async () => {
  await new Chart(attendanceChart.value, {
    type: 'bar',
    data: {
      labels: props.label,
      datasets: [
        {
          borderWidth: 1,
          data: props.chartData
        }
      ]
    },
    options: {
      scales: {
        y: {
          ticks: {
            stepSize: 1
          }
        },
        x: {
          gridLines: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Attendance Chart'
        }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  })
})
</script>
