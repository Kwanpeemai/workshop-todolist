import { Controller } from "@hotwired/stimulus"

const MS_PER_DAY = 1000 * 60 * 60 * 24

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
    const now = this.today()
    const urgent = this.tasksValue.filter(t => {
      if (t.completed || !t.due_date) return false
      return this.diffDays(t.due_date, now) <= 2
    })

    this.updateBadge(urgent.length)
    this.updateList(urgent, now)

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

  updateList(tasks, now) {
    if (!this.hasListTarget) return

    this.listTarget.textContent = ""

    if (tasks.length === 0) {
      const empty = document.createElement("div")
      empty.className = "px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm"
      empty.textContent = "No upcoming deadlines"
      this.listTarget.appendChild(empty)
      return
    }

    tasks.forEach((t, index) => {
      if (index > 0) {
        const divider = document.createElement("div")
        divider.className = "border-t border-gray-100 dark:border-gray-700"
        this.listTarget.appendChild(divider)
      }
      this.listTarget.appendChild(this.buildTaskItem(t, now))
    })
  }

  buildTaskItem(t, now) {
    const days = this.diffDays(t.due_date, now)
    const isOverdue = days < 0
    const isToday = days === 0

    const label = this.dueLabel(days, isOverdue, isToday)
    let colorClass
    if (isOverdue) colorClass = "text-coral-600 dark:text-coral-400"
    else if (isToday) colorClass = "text-amber-600 dark:text-amber-400"
    else colorClass = "text-primary-600 dark:text-primary-400"

    let dotColor
    if (isOverdue) dotColor = "bg-coral-500"
    else if (isToday) dotColor = "bg-amber-500"
    else dotColor = "bg-primary-500"

    const wrapper = document.createElement("div")
    wrapper.className = "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"

    const row = document.createElement("div")
    row.className = "flex items-start gap-3"

    const dot = document.createElement("span")
    dot.className = `mt-1.5 w-2 h-2 rounded-full ${dotColor} flex-shrink-0`

    const content = document.createElement("div")
    content.className = "min-w-0 flex-1"

    const title = document.createElement("p")
    title.className = "text-sm font-medium text-gray-800 dark:text-gray-200 truncate"
    title.textContent = t.title

    const subtitle = document.createElement("p")
    subtitle.className = `text-xs ${colorClass} font-medium mt-0.5`
    subtitle.textContent = label

    const dateEl = document.createElement("span")
    dateEl.className = "text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap"
    const due = new Date(t.due_date + "T00:00:00")
    dateEl.textContent = due.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    content.appendChild(title)
    content.appendChild(subtitle)
    row.appendChild(dot)
    row.appendChild(content)
    row.appendChild(dateEl)
    wrapper.appendChild(row)
    return wrapper
  }

  notify(tasks) {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const now = this.today()
    const overdue = tasks.filter(t => this.diffDays(t.due_date, now) < 0)

    let title
    if (overdue.length > 0) {
      const plural = overdue.length > 1 ? "s" : ""
      title = `⚠️ ${overdue.length} overdue task${plural}!`
    } else {
      const plural = tasks.length > 1 ? "s" : ""
      title = `📋 ${tasks.length} task${plural} due soon`
    }

    const body = tasks.slice(0, 3).map(t => `• ${t.title}`).join("\n")

    new Notification(title, {
      body,
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

  today() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  diffDays(dueDateStr, now) {
    const due = new Date(dueDateStr + "T00:00:00")
    return Math.floor((due - now) / MS_PER_DAY)
  }

  dueLabel(days, isOverdue, isToday) {
    if (isOverdue) {
      const abs = Math.abs(days)
      return `Overdue by ${abs} day${abs > 1 ? "s" : ""}`
    }
    if (isToday) return "Due today"
    return `Due in ${days} day${days > 1 ? "s" : ""}`
  }
}
