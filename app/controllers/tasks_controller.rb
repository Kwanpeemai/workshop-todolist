class TasksController < ApplicationController
  before_action :set_task, only: %i[show edit update destroy]

  def index
    @tasks = Task.order(:position)
    @filter = params[:filter] || "all"
    @tasks = case @filter
    when "active" then @tasks.active
    when "completed" then @tasks.done
    else @tasks
    end
    @tasks = @tasks.search(params[:query]) if params[:query].present?
    @tasks = @tasks.tagged_with(params[:tag]) if params[:tag].present?
    @tags = Tag.joins(:task_tags).distinct.order(:name)
  end

  def show
  end

  def calendar
    @date = params[:date] ? Date.parse(params[:date]) : Date.current
    @start_date = @date.beginning_of_month.beginning_of_week(:sunday)
    @end_date = @date.end_of_month.end_of_week(:sunday)
    @tasks_by_date = Task.where(due_date: @start_date..@end_date)
                         .order(priority: :desc, title: :asc)
                         .group_by(&:due_date)
  end

  def new
    @task = Task.new
  end

  def create
    @task = Task.new(task_params)
    respond_to do |format|
      if @task.save
        format.turbo_stream
        format.html { redirect_to tasks_path, notice: "Task was successfully created." }
      else
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit
  end

  def update
    respond_to do |format|
      if @task.update(task_params)
        format.turbo_stream
        format.html { redirect_to tasks_path, notice: "Task was successfully updated." }
      else
        format.html { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @task.destroy
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to tasks_path, notice: "Task was successfully deleted." }
    end
  end

  def sort
    params[:task_ids].each_with_index do |id, index|
      Task.where(id: id).update_all(position: index + 1)
    end
    head :ok
  end

  private

  def set_task
    @task = Task.find(params[:id])
  end

  def task_params
    params.require(:task).permit(:title, :completed, :priority, :due_date, tag_ids: [])
  end
end
