import { onMounted, ref } from 'vue'

export default {
  setup() {
    const message = ref('Loading backend...')
    const title = ref('Working page')

    onMounted(async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/health/')
        const data = await response.json()
        message.value = data.message
      } catch (error) {
        message.value = 'Could not connect to backend'
        console.error(error)
      }
    })

    function changeMessage() {
      message.value = 'Button clicked successfully.'
    }

    return {
      message,
      title,
      changeMessage
    }
  }
}