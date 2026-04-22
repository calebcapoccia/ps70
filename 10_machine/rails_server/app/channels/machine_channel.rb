class MachineChannel < ApplicationCable::Channel
  def subscribed
    stream_from "machine_progress"
    Rails.logger.info "🔌 Client subscribed to machine_progress channel"
  end

  def unsubscribed
    Rails.logger.info "🔌 Client unsubscribed from machine_progress channel"
  end
end
