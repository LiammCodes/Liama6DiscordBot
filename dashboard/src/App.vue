<template>
  <main :data-theme="currentTheme" class="min-h-screen bg-base-300">
    <div class="container mx-auto p-6 space-y-4">
      <div class="navbar bg-base-100 rounded-box shadow px-5">
        <div class="flex-1">
          <a class="text-xl font-bold">Liama6DiscordBot</a>
        </div>
        <div class="flex-none space-x-4">
          <label class="swap swap-rotate">
            <input type="checkbox" v-model="isDark" class="theme-controller" value="dark" />
            <svg class="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
            <svg class="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
          </label>
          <button @click="save" class="btn btn-primary rounded-lg">Save</button>
          <button @click="restart" class="btn btn-error rounded-lg">Restart</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Cards Module</h2>
            <label class="label cursor-pointer space-x-2">
              <span class="label-text">Enabled</span>
              <input 
                type="checkbox" 
                class="toggle toggle-success"
                v-model="form.cards.enabled" 
                />
            </label>
            <label class="label">
              <span class="label-text">Listening & Posting Channels</span>
            </label>
            <div class="dropdown w-full">
              <div tabindex="0" role="button" class="btn btn-text rounded-lg w-full justify-start">
                {{ selectedChannelsText }}
              </div>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-full max-h-60 overflow-y-auto">
                <li v-for="ch in channels" :key="ch.id">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" class="checkbox" :value="ch.id" v-model="form.cards.channels" />
                    <span class="label-text ml-2">{{ ch.name }}</span>
                  </label>
                </li>
              </ul>
            </div>
            <p class="text-xs opacity-70">Bot only reacts to messages in selected channels and posts in the same channel.</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Twitch Module</h2>
            <label class="label cursor-pointer">
              <span class="label-text">Enabled</span>
              <input type="checkbox" class="toggle toggle-success" v-model="form.twitch.enabled" />
            </label>
            <label class="label">
              <span class="label-text">Announce Channels</span>
            </label>
            <div class="dropdown w-full">
              <div tabindex="0" role="button" class="btn btn-text rounded-lg w-full justify-start">
                {{ selectedTwitchChannelsText }}
              </div>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-full max-h-60 overflow-y-auto">
                <li v-for="ch in channels" :key="ch.id">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" class="checkbox" :value="ch.id" v-model="form.twitch.channels" />
                    <span class="label-text ml-2">{{ ch.name }}</span>
                  </label>
                </li>
              </ul>
            </div>
            <p class="text-xs opacity-70">Login: {{ form.twitch.login }} · Poll: {{ form.twitch.pollMs }} ms</p>
          </div>
        </div>

        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Stock Charts Module</h2>
            <label class="label cursor-pointer">
              <span class="label-text">Enabled</span>
              <input type="checkbox" class="toggle toggle-success" v-model="form.stock.enabled" />
            </label>
            <label class="label">
              <span class="label-text">Listening Channels</span>
            </label>
            <div class="dropdown w-full">
              <div tabindex="0" role="button" class="btn btn-text rounded-lg w-full justify-start">
                {{ selectedStockChannelsText }}
              </div>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box w-full max-h-60 overflow-y-auto">
                <li v-for="ch in channels" :key="ch.id">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" class="checkbox" :value="ch.id" v-model="form.stock.channels" />
                    <span class="label-text ml-2">{{ ch.name }}</span>
                  </label>
                </li>
              </ul>
            </div>
            <p class="text-xs opacity-70">Responds to $TICKER with stock data.</p>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Logs</h2>
          <pre class="textarea textarea-bordered h-80 overflow-auto whitespace-pre-wrap w-full">{{ logs.join('\n') }}</pre>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from 'vue'

type Config = {
  cards: { enabled: boolean; channelId?: string | null; channels?: string[] }
  twitch: { enabled: boolean; channelId?: string | null; channels?: string[]; login: string; pollMs: number }
  stock: { enabled: boolean; channelId?: string | null; channels?: string[]; timeframes: string[] }
}

type Channel = { id: string; name: string }

const isDark = ref(true)
const currentTheme = computed(() => {
  return isDark.value ? 'dark' : 'light'
})
const form = reactive<Config>({
  cards: { enabled: true, channelId: null, channels: [] },
  twitch: { enabled: true, channelId: null, channels: [], login: 'liama6', pollMs: 60000 },
  stock: { enabled: true, channelId: null, channels: [], timeframes: ['5m'] },
})
const logs = ref<string[]>([])
const channels = ref<Channel[]>([])

const selectedChannelsText = computed(() => {
  if (!form.cards.channels || form.cards.channels.length === 0) {
    return 'Select channels...'
  }
  if (form.cards.channels.length === 1) {
    const channel = channels.value.find(ch => ch.id === form.cards.channels![0])
    return channel?.name || 'Unknown channel'
  }
  return `${form.cards.channels.length} channels selected`
})

const selectedTwitchChannelsText = computed(() => {
  if (!form.twitch.channels || form.twitch.channels.length === 0) {
    return 'Select channels...'
  }
  if (form.twitch.channels.length === 1) {
    const channel = channels.value.find(ch => ch.id === form.twitch.channels![0])
    return channel?.name || 'Unknown channel'
  }
  return `${form.twitch.channels.length} channels selected`
})

const selectedStockChannelsText = computed(() => {
  if (!form.stock.channels || form.stock.channels.length === 0) {
    return 'Select channels...'
  }
  if (form.stock.channels.length === 1) {
    const channel = channels.value.find(ch => ch.id === form.stock.channels![0])
    return channel?.name || 'Unknown channel'
  }
  return `${form.stock.channels.length} channels selected`
})

async function load() {
  const cfgR = await fetch('/api/config')
  const data: Config = await cfgR.json()
  form.cards.enabled = data.cards.enabled
  form.cards.channelId = data.cards.channelId ?? null
  form.cards.channels = data.cards.channels ?? []
  form.twitch.enabled = data.twitch.enabled
  form.twitch.channelId = data.twitch.channelId ?? null
  form.twitch.channels = data.twitch.channels ?? []
  form.twitch.login = data.twitch.login
  form.twitch.pollMs = data.twitch.pollMs
  form.stock.enabled = data.stock.enabled
  form.stock.channelId = data.stock.channelId ?? null
  form.stock.channels = data.stock.channels ?? []
  form.stock.timeframes = data.stock.timeframes ?? ['5m']

  const chR = await fetch('/api/channels')
  channels.value = await chR.json()
}

async function refreshLogs() {
  const r = await fetch('/api/logs')
  logs.value = await r.json()
}

async function save() {
  await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
}

async function restart() {
  await fetch('/api/restart', { method: 'POST' })
}

onMounted(() => {
  load()
  refreshLogs()
  setInterval(refreshLogs, 2000)
})
</script>


<style scoped>
</style>
