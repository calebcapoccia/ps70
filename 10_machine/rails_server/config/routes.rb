Rails.application.routes.draw do
  # Root route
  root "home#index"

  # API routes
  namespace :api do
    # Braille conversion
    post 'convert/text', to: 'braille#convert_text'

    # Machine control
    post 'connect', to: 'machine#connect'
    post 'disconnect', to: 'machine#disconnect'
    get 'status', to: 'machine#status'
    post 'command', to: 'machine#command'
    post 'send/dots', to: 'machine#send_dots'
    post 'home', to: 'machine#home'
    post 'stop', to: 'machine#stop'
    post 'clear', to: 'machine#clear'
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
