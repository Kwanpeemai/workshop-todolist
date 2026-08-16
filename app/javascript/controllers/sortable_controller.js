import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

export default class SortableController extends Controller {
  connect() {
    this.sortable = Sortable.create(this.element, {
      animation: 250,
      ghostClass: "opacity-30",
      dragClass: "shadow-2xl",
      handle: "[data-sortable-handle]",
      onEnd: this.onEnd.bind(this)
    })
  }

  disconnect() {
    this.sortable.destroy()
  }

  onEnd() {
    const ids = Array.from(this.element.children).map(el => {
      const match = el.id.match(/task_(\d+)/)
      return match ? match[1] : null
    }).filter(Boolean)

    const meta = document.querySelector('meta[name="csrf-token"]')
    if (!meta) return

    fetch("/tasks/sort", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": meta.content
      },
      body: JSON.stringify({ task_ids: ids })
    }).catch(() => {})
  }
}
