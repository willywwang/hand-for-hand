angular.module('app')
.controller('modalController', ['$scope', '$rootScope','$uibModal', '$uibModalInstance', '$http', 'user', 'post', 'messages', 'message',
	function($scope, $rootScope, $uibModal, $uibModalInstance, $http, user, post, messages, message) {
		$scope.didUserSubmit = false;
		$scope.showLoginError = false;
		$scope.showPostingError = false;
		$scope.showSignUpError = false;
		$scope.showMessagingError = false;
		$scope.inboxView = true;
		$scope.sendView = false;
		$scope.messagingError = "";
		$scope.loginError = "";
		$scope.postingError = "";
		$scope.signupError = "";
		$scope.username = "";
		$scope.password = "";
		$scope.location = "";
		$scope.email = "";
		$scope.firstname = "";
		$scope.surname = "";
		$scope.gender = "";
		$scope.address = "";
		$scope.city = "";
		$scope.country = "";
		$scope.postalCode = "";
		$scope.password = "";
		$scope.passwordConfirm = "";
		$scope.title = "";
		$scope.description = "";
		$scope.toUser = (post) ? post.username : "";
		$scope.subject = "";
		$scope.content = "";
		$scope.selectedTypes = [];
		$scope.user = user;
		$scope.post = post;
		$scope.messages = messages;
		$scope.message = message;
		$scope.types = [
		{
			name: 'Food',
			value: 0,
			ticked: false
		},
		{
			name: 'Shelter',
			value: 1,
			ticked: false
		},
		{
			name: 'Clothes',
			value: 2,
			ticked: false
		},
		{
			name: 'Miscellaneous',
			value: 3,
			ticked: false
		}];

		if ($scope.post) {
			$scope.title = $scope.post.title;
			$scope.description = $scope.post.serviceContent;
			var categoryTypes = [];

			if ($scope.post.serviceType && $scope.post.serviceType.length > 0) {
				$scope.post.serviceType.forEach(function(category) {
					categoryTypes.push(category.value);
				});

				$scope.types.forEach(function(type) {
					if (categoryTypes.includes(type.value)) {
						type.ticked = true;
					}
				});
			}

			$scope.location = $scope.post.location;
		}

		$scope.openMessage = function(message) {
			$scope.messageView = true;
			$scope.inboxView = false;
			$scope.sendView = false;

			$scope.message = message;
		}

		$scope.openDeleteMessage = function(message) {
			var deleteMessageModalInstance = $uibModal.open({
				templateUrl: 'message.delete.template.html',
				controller: 'modalController',
				resolve: {
					user: function() {
						return $scope.user;
					},
					post: function() {
						return null;
					},
					messages: function() {
						return $scope.messages;
					},
					message: function() {
						return message;
					}
				}
			});

			deleteMessageModalInstance.result.then(function(messageId) {
				var messageIndex = $scope.messages.findIndex(m => m.id == messageId);

				$scope.messages.splice(messageIndex, 1);
			});
		}

		$scope.deleteMessage = function() {
			$http.delete('message/' + $scope.message.id).success(function(data) {
				if (data.state === 'success') {
					$uibModalInstance.close($scope.message.id);
				}
			});
		}

		$scope.toggleView = function(state) {
			if (state === 'inbox') {
				$scope.inboxView = true;
				$scope.sendView = false;
				$scope.messageView = false;
			} else {
				$scope.inboxView = false;
				$scope.sendView = true;
				$scope.messageView = false;
			}
		}

		$scope.close = function() {
			$uibModalInstance.close();
		};

		$scope.send = function() {
			$scope.didUserSubmit = true;
			$scope.showMessagingError = false;
			$scope.messagingError = "";

			var request = {
				toUser: $scope.toUser,
				fromUser: $scope.user.username,
				subject: $scope.subject,
				content: $scope.content
			};

			$http.post('/message/send', request).success(function(data) {
				if (data.state === 'fail') {
					$scope.didUserSubmit = false;
					$scope.showMessagingError = true;
					$scope.messagingError = data.error;
				} else if (data.state === 'success') {
					$scope.didUserSubmit = false;
					$scope.showMessagingError = false;
					$scope.messagingError = "";

					// did we come from post view
					if (!$scope.messages) {
						$scope.close();
						return;
					}

					$scope.messages.unshift(data.message);
					$scope.toggleView('inbox');
				}
			})

		}

		$scope.signup = function() {
			$scope.didUserSubmit = true;
			$scope.showSignUpError = false;
			$scope.signupError = "";

			if ($scope.password !== $scope.passwordConfirm) {
				$scope.didUserSubmit = false;
				$scope.showSignUpError = true;
				$scope.signupError = "Passwords do not match. Please try again."
				return;
			}

			var request = {
				username : $scope.username,
				email: $scope.email,
				name: $scope.firstname + ' ' + $scope.surname,
				gender: $scope.gender,
				address: $scope.address,
				city: $scope.city,
				country: $scope.country,
				postalCode: $scope.postalCode,
				password: $scope.password
			};

			$http.post('auth/signup', request).success(function (data) {
				if (data.state === 'success') {
					$scope.didUserSubmit = false;
					$scope.showSignUpError = false;
					$scope.signupError = '';
					$uibModalInstance.close(data.user);
				} else {
					$scope.didUserSubmit = false;
					$scope.showSignUpError = true;
					$scope.signupError = data.error;
				}
			}, function(err) {
				$scope.didUserSubmit = false;
				$scope.showSignUpError = true;
				$scope.signupError = "An error occured, please try again."
			})
		}

		$scope.update = function() {
			$scope.didUserSubmit = true;
			$scope.showPostingError = false;
			$scope.postingError = "";

			var request = {
				username: $scope.post.username,
				id: $scope.post.id,
				serviceType: $scope.selectedTypes,
				serviceContent: $scope.description,
				title: $scope.title
			};

			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 'address': $scope.location}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					request.location = {
						lat: results[0].geometry.location.lat(),
						lng: results[0].geometry.location.lng()
					};

					$http.post('/post/update', request).success(function (data) {
						if (data.state === 'fail') {
							$scope.didUserSubmit = false;
							$scope.showPostingError = true;
							$scope.postingError = "An unknown error occured";
						} else if (data.state === 'success') {
							$scope.didUserSubmit = false;
							$scope.showPostingError = false;
							$scope.postingError = "";
							$uibModalInstance.close(request);
						} else {
							$scope.didUserSubmit = false;
							$scope.showPostingError = true;
							$scope.postingError = "An unknown error occured";
						}
					}, function(err) {
						$scope.didUserSubmit = false;
						$scope.showPostingError = true;
						$scope.postingError = "An unknown error occured";
					});
				}
			});
		}
		
		$scope.delete = function() {
			var request = {
				username: $scope.post.username,
				id: $scope.post.id
			};
			$http.delete('/post/delete/username/' + request.username + '/id/' + request.id).success(function (data) {
				if (data.state === 'fail') {
					$scope.didUserSubmit = false;
					$scope.showPostingError = true;
					$scope.postingError = "An unknown error occured";
				} else if (data.state === 'success') {
					$scope.didUserSubmit = false;
					$scope.showPostingError = false;
					$scope.postingError = "";
					$uibModalInstance.close(request);
				} else {
					$scope.didUserSubmit = false;
					$scope.showPostingError = true;
					$scope.postingError = "An unknown error occured";
				}
			}, function(err) {
				$scope.didUserSubmit = false;
				$scope.showPostingError = true;
				$scope.postingError = "An unknown error occured";
			});
		}

		$scope.signin = function() {
			$scope.didUserSubmit = true;
			$scope.showLoginError = false;
			$scope.loginError = "";

			var request = {
				username: $scope.username,
				password: $scope.password
			};

			$http.post('auth/login', request).success(function (data) {
				if (data.state === 'fail') {
					$scope.didUserSubmit = false;
					$scope.showLoginError = true;
					$scope.loginError = 'Username or password is incorrect please try again.';
				} else if (data.state === 'success') {
					$scope.didUserSubmit = false;
					$scope.showLoginError = false;
					$scope.loginError = '';
					$uibModalInstance.close(data.user);
				} else {
					$scope.didUserSubmit = false;
					$scope.showLoginError = true;
					$scope.loginError = 'An error occured, please try again.';
				}
			}, function(err) {
				$scope.didUserSubmit = false;
				$scope.showLoginError = true;
				$scope.loginError = 'An error occured, please try again.';
			});
		};

		$scope.submit = function() {
			$scope.didUserSubmit = true;
			$scope.showPostingError = false;
			$scope.postingError = "";

			var request = {
				username: $scope.user.username,
				serviceType: $scope.selectedTypes,
				serviceContent: $scope.description,
				title: $scope.title
			};

			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ 'address': $scope.location}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					request.location = {
						lat: results[0].geometry.location.lat(),
						lng: results[0].geometry.location.lng()
					};

					$http.post('/post/add', request).success(function (data) {
						if (data.state === 'fail') {
							$scope.didUserSubmit = false;
							$scope.showPostingError = true;
							$scope.postingError = "An unknown error occured";
						} else if (data.state === 'success') {
							$scope.didUserSubmit = false;
							$scope.showPostingError = false;
							$scope.postingError = "";
							request.id = data.id;
							request.username = $scope.user.username;
							$uibModalInstance.close(request);
						} else {
							$scope.didUserSubmit = false;
							$scope.showPostingError = true;
							$scope.postingError = "An unknown error occured";
						}
					}, function(err) {
						$scope.didUserSubmit = false;
						$scope.showPostingError = true;
						$scope.postingError = "An unknown error occured";
					});
				}
			});
		}
	}]);