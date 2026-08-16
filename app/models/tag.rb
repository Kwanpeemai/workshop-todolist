class Tag < ApplicationRecord
  has_many :task_tags, dependent: :destroy
  has_many :tasks, through: :task_tags

  validates :name, presence: true, uniqueness: true

  before_validation :normalize_name

  private

  def normalize_name
    self.name = name&.strip&.downcase
  end
end
