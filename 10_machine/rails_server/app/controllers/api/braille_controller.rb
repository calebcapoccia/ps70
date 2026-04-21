module Api
  class BrailleController < ApplicationController
    def convert_text
      text = params[:text] || ''
      auto_wrap = params[:auto_wrap].nil? ? true : params[:auto_wrap]
      mirror = params[:mirror].nil? ? true : params[:mirror]

      if text.strip.empty?
        render json: { success: false, error: "No text provided" }, status: :bad_request
        return
      end

      text = BrailleConverter.word_wrap(text) if auto_wrap
      info = BrailleConverter.get_text_info(text)

      unless info[:fits]
        render json: {
          success: false,
          error: "Text too long. Max #{info[:max_chars]} characters, got #{info[:total_chars]}"
        }, status: :bad_request
        return
      end

      coords = BrailleConverter.braille_to_coords(text, mirror: mirror)

      render json: {
        success: true,
        dots: coords,
        info: info,
        wrapped_text: text
      }
    end
  end
end
