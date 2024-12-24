const SSSTAlertActionType = {
  Default: 0,
  Destructive: 1,
  Cancel: 2,
};

class SSSTAlertAction {
  constructor(title, actionType, handler) {
    this.title = title
    this.actionType = actionType
    this.handler = handler
  }
}

const SSSTAlertPresentationStyle = {
  Default: 0,
  High: 1,
};

class SSSTAlertViewController {
  constructor(alertStr, alertID) {
    this._alertTitle = alertStr
    this._actions = []
    this._alertID = alertID ? "-" + alertID : ""
    this.completionHandler = null
    this.presentationStyle = SSSTAlertPresentationStyle.Default
  }

  static presentAlertWithDismiss(alertStr) {
    let aC = new SSSTAlertViewController(alertStr)
    aC.addAction("Dismiss", SSSTAlertActionType.Default, null)
    aC.presentView()
  }

  addAction(title, actionType, handler) {
    this._actions.push(new SSSTAlertAction(title, actionType, handler))
  }

  presentView() {
    // Create the backdrop (overlay)
    const backdrop = document.createElement('div');
    backdrop.id = "ssstalertvc-backdrop" + this._alertID
    backdrop.classList.add('alert-backdrop');

    // Create the alert box
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert-box');
    if (this.presentationStyle === SSSTAlertPresentationStyle.Default) {
      alertBox.classList.add('alert-box-default');
    } else if (this.presentationStyle === SSSTAlertPresentationStyle.High) {
      alertBox.classList.add('alert-box-high')
    }

    // Create the title element
    const titleElement = document.createElement('div');
    titleElement.classList.add('alert-title');
    titleElement.id = "ssstalertvc-title" + this._alertID
    titleElement.innerText = this._alertTitle;

    // Create the actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('alert-actions');

    // Add a class for two or more buttons
    if (this._actions.length <= 2) {
      actionsContainer.classList.add('two-buttons');
    } else {
      actionsContainer.classList.add('more-buttons');
    }

    // Create each action button
    this._actions.forEach(action => {
      const button = document.createElement('button');
      button.classList.add('alert-action-button');
      button.innerText = action.title;
      button.id = MAUtils.sanitizedElementID("alertButton_" + this._alertID + button.innerText)

      if (action.actionType === SSSTAlertActionType.Destructive) {
        button.classList.add('destructive');
      }

      actionLog.registerButtonEventListener(button, 'click', () => {
        if (action.handler) {
          action.handler(); // Call the handler function
        }
        document.body.removeChild(backdrop); // Remove the alert

        if (this.completionHandler) {
          this.completionHandler()
        }
      });
      actionsContainer.appendChild(button);
    });

    // Append title and actions to the alert box
    alertBox.appendChild(titleElement);

    if (this.customViewHandler) {
      const customViewDiv = document.createElement('div')
      customViewDiv.id = "ssstalertvc-customView" + this._alertID
      alertBox.appendChild(customViewDiv)
      this.customViewHandler(customViewDiv)
    }

    alertBox.appendChild(actionsContainer);

    // Append the alert box to the backdrop
    backdrop.appendChild(alertBox);

    // Append the backdrop to the body
    document.body.appendChild(backdrop);
  }

  static clearAlerts() {
    const els = document.getElementsByClassName("alert-backdrop")
    if (!els) { return }

    for (let i = 0; i < els.length; ++i) {
      const el = els[i]
      if (el) {
        document.body.removeChild(el)
      }
    }
  }

  static currentAlertTitle() {
    const els = document.getElementsByClassName("alert-title")
    if (!els || els.length <= 0) { return }
    return els[0].innerText
  }
}
