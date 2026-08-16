import { Controller } from "@hotwired/stimulus"

export default class NotificationController extends Controller {
  static targets = ["badge", "panel", "list"]
  static values = { tasks: Array }

  connect() {
    this.checkInterval = null
    this.panelOpen = false

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    this.startChecking()
  }

  disconnect() {
    if (this.checkInterval) clearInterval(this.checkInterval)
  }

  startChecking() {
    this.check()
    this.checkInterval = setInterval(() => this.check(), 60000)
  }

  check() {
    const tasks = this.tasksValue
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const urgent = tasks.filter(t => {
      if (t.completed) return false
      if (!t.due_date) return false
      const due = new Date(t.due_date + "T00:00:00")
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24))
      return diffDays <= 2
    })

    this.updateBadge(urgent.length)
    this.updateList(urgent)

    const notifiedKey = `todo-notified-${new Date().toDateString()}`
    if (urgent.length > 0 && !sessionStorage.getItem(notifiedKey)) {
      this.notify(urgent)
      sessionStorage.setItem(notifiedKey, "true")
    }
  }

  updateBadge(count) {
    if (!this.hasBadgeTarget) return
    this.badgeTarget.textContent = count
    this.badgeTarget.classList.toggle("hidden", count === 0)
  }

  updateList(tasks) {
    if (!this.hasListTarget) return
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (tasks.length === 0) {
      this.listTarget.innerHTML = `
        <div class="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          No upcoming deadlines
        </div>`
      return
    }

    this.listTarget.innerHTML = tasks.map(t => {
      const due = new Date(t.due_date + "T00:00:00")
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24))
      const isOverdue = diffDays < 0
      const isToday = diffDays === 0

      const label = isOverdue
        ? `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`
        : isToday
        ? "Due today"
        : `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`

      const colorClass = isOverdue
        ? "text-coral-600 dark:text-coral-400"
        : isToday
        ? "text-amber-600 dark:text-amber-400"
        : "text-primary-600 dark:text-primary-400"

      const dotColor = isOverdue
        ? "bg-coral-500"
        : isToday
        ? "bg-amber-500"
        : "bg-primary-500"

      return `
        <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <div class="flex items-start gap-3">
            <span class="mt-1.5 w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${this.escapeHtml(t.title)}</p>
              <p class="text-xs ${colorClass} font-medium mt-0.5">${label}</p>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        </div>`
    }).join('<div class="border-t border-gray-100 dark:border-gray-700"></div>')
  }

  notify(tasks) {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const overdue = tasks.filter(t => {
      const due = new Date(t.due_date + "T00:00:00")
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return due < now
    })

    const title = overdue.length > 0
      ? `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}!`
      : `📋 ${tasks.length} task${tasks.length > 1 ? "s" : ""} due soon`

    const body = tasks.slice(0, 3).map(t => `• ${t.title}`).join("\n")

    new Notification(title, {
      body: body,
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>",
      tag: "todo-reminder"
    })
  }

  toggle() {
    if (!this.hasPanelTarget) return
    this.panelOpen = !this.panelOpen
    this.panelTarget.classList.toggle("hidden", !this.panelOpen)

    if (this.panelOpen) {
      this.closeHandler = (e) => {
        if (!this.element.contains(e.target)) {
          this.panelOpen = false
          this.panelTarget.classList.add("hidden")
          document.removeEventListener("click", this.closeHandler)
        }
      }
      setTimeout(() => document.addEventListener("click", this.closeHandler), 0)
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}
