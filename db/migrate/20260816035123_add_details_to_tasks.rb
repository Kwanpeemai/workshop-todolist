class AddDetailsToTasks < ActiveRecord::Migration[8.0]
  def change
    add_column :tasks, :priority, :integer, default: 0, null: false
    add_column :tasks, :due_date, :date
    add_column :tasks, :position, :integer

    Task.reset_column_information
    Task.order(:created_at).each.with_index(1) do |task, i|
      task.update_column(:position, i)
    end
  end
end
