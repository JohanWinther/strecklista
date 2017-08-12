num_pos = 1;
pin_code = '';
link = $('#link_url').val();
$('#numpad li').tap (event) ->
  target = $(event.target)
  target.addClass 'pressed'

  setTimeout ->
    target.removeClass 'pressed'
  , 500

  press target.text()

press = (command) ->
  switch command
    when 'E'
      $('#display li').each (i,v) ->
        pin_code += $(v).text()
      window.location.href = "http://cppt.su/"+link+"/"+pin_code;
    when 'C'
      $('#display li').each (i,v) ->
        $(v).text '+'
    else
      $('#display li:nth-child('+num_pos+')').text(command)
      num_pos++
      num_pos = 1 if num_pos > 4
