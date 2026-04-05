<script setup>
import { onMounted, ref } from 'vue'

const message = ref('Loading backend...')

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
</script>

<template>
  <main>
    <h1>Ogorogile Frontend</h1>
    <p>{{ message }}</p>
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
}
</style>