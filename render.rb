def partial(partial)
  Haml::Engine.new(File.read("./haml/partial/_#{partial}.haml")).render
end


def include(partial)
  Haml::Engine.new(File.read("./haml/include/_#{partial}.haml")).render
end


def element(partial)
  Haml::Engine.new(File.read("./haml/element/_#{partial}.haml")).render
end
