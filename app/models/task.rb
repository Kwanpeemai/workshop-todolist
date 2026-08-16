class Task < ApplicationRecord
  validates :title, presence: true
  validates :completed, inclusion: { in: [ true, false ] }
  enum :priority, { low: 0, medium: 1, high: 2 }, validate: true

  scope :active, -> { where(completed: false) }
  scope :done, -> { where(completed: true) }

  before_create :set_position

  def overdue?
    due_date.present? && !completed? && due_date < Date.current
  end

  def due_soon?
    due_date.present? && !completed? && !overdue? && due_date <= 2.days.from_now.to_date
  end

  private

  def set_position
    self.position ||= (Task.maximum(:position) || 0) + 1
  end
end
