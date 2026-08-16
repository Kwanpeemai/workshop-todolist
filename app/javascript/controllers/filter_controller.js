import { Controller } from "@hotwired/stimulus"

export default class FilterController extends Controller {
  filter(event) {
    event.preventDefault()
    const filter = event.currentTarget.dataset.filter
    window.Turbo.visit(`/?filter=${encodeURIComponent(filter)}`, { action: "replace" })
  }
}
