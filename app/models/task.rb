class Task < ApplicationRecord
  has_many :task_tags, dependent: :destroy
  has_many :tags, through: :task_tags

  validates :title, presence: true
  validates :completed, inclusion: { in: [ true, false ] }
  enum :priority, { low: 0, medium: 1, high: 2 }, validate: true

  scope :active, -> { where(completed: false) }
  scope :done, -> { where(completed: true) }
  scope :search, ->(query) { where("title LIKE ?", "%#{sanitize_sql_like(query)}%") if query.present? }
  scope :tagged_with, ->(tag_name) { joins(:tags).where(tags: { name: tag_name }) if tag_name.present? }

  def tag_list
    tags.pluck(:name).join(", ")
  end

  def tag_list=(names)
    self.tags = names.split(",").map(&:strip).reject(&:blank?).uniq.map { |name|
      Tag.find_or_create_by(name: name.downcase)
    }
  end

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
