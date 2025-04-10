import os


def is_production_environment():
    return os.environ.get("PRODUCTION") == "true"


def get_user_data_path():
    if is_production_environment():
        return os.environ.get("USER_DATA_PATH", os.getcwd())
    else:
        return os.getcwd()


def get_temp_path():
    return f"{get_user_data_path()}/temp"


def get_log_level():
    return os.environ.get("LOG_LEVEL", "DEBUG")


def get_lorem_ipsum():
    return """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consectetur aliquet risus vitae congue. Sed cursus egestas faucibus. Quisque nec facilisis tortor. Nam faucibus odio sit amet eros consectetur, sed viverra magna fringilla. Quisque tincidunt iaculis elit id tristique. Nunc fringilla lectus id gravida molestie. Etiam nisl orci, accumsan eu libero eget, cursus facilisis purus. Vivamus lacinia velit rhoncus, sollicitudin neque vitae, lobortis lacus. In et accumsan urna, nec condimentum nunc. Curabitur molestie dictum placerat. Nam sollicitudin gravida justo, ac interdum nisi luctus at.

Donec pretium est in orci finibus malesuada. Vivamus venenatis elementum enim eget pharetra. Nullam egestas eleifend turpis, ac finibus arcu molestie at. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut condimentum felis nulla, id hendrerit urna dapibus a. Cras diam mauris, dignissim vel ipsum vitae, commodo egestas enim. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer pretium et augue sit amet porta. Phasellus iaculis fringilla ornare. Nullam ac justo vehicula, faucibus neque sed, porta sapien. Curabitur dolor nibh, cursus ut congue sit amet, ornare vitae ante. Vestibulum dapibus nisi libero, auctor luctus nulla condimentum id.

Suspendisse ut nulla vel turpis venenatis sagittis nec ac lacus. In maximus dolor ac nulla pretium, non iaculis odio fermentum. Donec laoreet velit ut tellus accumsan sollicitudin. Praesent faucibus tellus non dolor eleifend euismod. Duis hendrerit nulla vel enim condimentum, sit amet rutrum nulla posuere. Etiam sed iaculis mauris. Aliquam vitae laoreet arcu, ut auctor dui.

In augue nisl, sollicitudin eget odio quis, finibus egestas felis. Aliquam placerat urna et odio tempor laoreet. Sed pellentesque nisi ut pretium ornare. Nulla condimentum maximus tellus, tincidunt aliquet sem volutpat id. Sed nec risus eros. Aliquam mauris ipsum, varius ac quam ut, condimentum molestie libero. Duis vel dolor non elit interdum cursus vel eu tortor. Vivamus nec erat a lectus cursus blandit. Pellentesque tempor orci eu metus placerat mattis.

Phasellus tincidunt justo ac quam iaculis, suscipit vehicula arcu consectetur. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed imperdiet nec lorem quis dictum. Nunc aliquet, dolor id sodales luctus, tortor leo tincidunt lacus, sed cursus mauris leo non est. Phasellus quis vehicula nibh, ut egestas sem. Pellentesque ullamcorper felis id urna malesuada pulvinar. Quisque pellentesque leo id mi fermentum, non accumsan massa vehicula. Quisque et dapibus dui. Aenean suscipit est mauris, sed pretium mi ornare eget. Suspendisse in quam neque. 
            """


if __name__ == "__main__":
    print(is_production_environment())
    print(get_user_data_path())
