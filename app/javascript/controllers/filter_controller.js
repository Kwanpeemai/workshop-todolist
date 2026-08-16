import { Controller } from "@hotwired/stimulus"

export default class FilterController extends Controller {
  static targets = ["tab", "tasks"]

  filter(event) {
    event.preventDefault()
    const filter = event.currentTarget.dataset.filter
    window.Turbo.visit(`/?filter=${filter}`, { action: "replace" })
  }
}
