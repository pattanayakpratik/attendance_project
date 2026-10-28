import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_attendance/main.dart';

void main() {
  testWidgets('AttendanceApp smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const AttendanceApp());

    // Verify that the login screen title renders
    expect(find.text('Login'), findsOneWidget);
  });
}
